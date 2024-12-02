"""
Main Flask application as well as routes of the app.
"""
import uuid
import redis
from threading import Thread
from rq import Queue
from flask import Flask, jsonify, request
from flask_cors import CORS
from helpers.download_url import download_video
from helpers.score import create_answer
from db_monitor import poll_connection

from models.BigFiveScores import BigFiveScores
from models.StarMethod import predict_star_scores, percentageFeedback
# initalize the Flask object
app = Flask(__name__)
CORS(app)
r = redis.Redis()
q = Queue(connection=r)


@app.before_first_request
def launch_polling_script():
    Thread(target=poll_connection, args=(r,), daemon=True).start()
    print("Launched polling script in different thread.")

@app.route("/predict", methods=["POST"])
def predict():
    """
    POST route that returns total text, audio and video predictions.
    """
    req = request.get_json() # Video URL  
    # Download the video from the firebase URL 
    video_url = req['videoUrl'] 
    if not video_url:
        return jsonify(errors="Required fields not in request body.") 
    print("About to download video") 
    download_video(video_url) # Download video from URL, returns path to video 
    
    content = {
        "fname": "video.mp4",
        "rename": str(uuid.uuid4()) + ".mp3" 
    }
    job = q.enqueue(create_answer, content)
    message = "Task " + str(job.get_id) + " added to queue at " + str(job.enqueued_at) + "." 
    return jsonify(message=message) 
	

@app.route('/big-five-feedback', methods=['POST'])
def get_big_five_feedback():
    data = request.get_json()
    scores = data
    big_five = BigFiveScores(
        scores['o'],
        scores['c'],
        scores['e'],
        scores['a'],
        scores['n']
    )

    user_feedback = [] 

    # Ensure the correct mapping of traits to their attributes
    for trait, attr in zip(['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'], ['o', 'c', 'e', 'a', 'n']):
        trait_level = big_five.determine_level(getattr(big_five, attr))
        user_feedback.append(BigFiveScores.FEEDBACK[trait][trait_level])
        

    return jsonify({'feedback': user_feedback})

@app.route('/star-feedback', methods=['POST'])
def get_star_feedback():
    """
    POST route that returns STAR feedback. Percentages of each part of the STAR method. And the breakdown of each sentence. 
    """
    # takes in evaluation.text_analysis.output_text
    data = request.get_json()
    star_scores = predict_star_scores(data)
    percentages = star_scores["percentages"]
    feedback = percentageFeedback(percentages)
    
    return jsonify({'feedback': feedback, "fufilledStar": star_scores["fufilledStar"]}) 

@app.route("/", methods=["GET"])
def index():
    """
    Home route.
    """
    return "Welcome to the ML API for Digital Coach ayayay"


if __name__ == "___main__":
    app.run(debug=True, host="0.0.0.0")
