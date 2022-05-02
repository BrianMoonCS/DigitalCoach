import {
  addDoc,
  collection,
  collectionGroup,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  Query,
  query,
  Timestamp,
} from "firebase/firestore";
import FirebaseService from "@App/lib/firebase/FirebaseService";
import {
  IBaseInterview,
  IInterviewAttributes,
  TInterviewDocumentReference,
} from "@App/lib/interview/models";

class InterviewService extends FirebaseService {
  private firestore: Firestore;

  constructor() {
    super();

    this.firestore = getFirestore(this.app);
  }

  /**
   * This function returns a reference to a collection group called interviews.
   * @returns A Query<IInterviewAttributes>
   */
  private getCollectionGroupRef() {
    return collectionGroup(
      this.firestore,
      "interviews"
    ) as Query<IInterviewAttributes>;
  }

  /**
   * If the argument is a DocumentReference, return it. Otherwise, return a DocumentReference
   * @param {TInterviewDocumentReference} ref - TInterviewDocumentReference
   * @returns A DocumentReference&lt;IInterviewAttributes&gt;
   */
  getDocRef(ref: TInterviewDocumentReference) {
    if (ref instanceof DocumentReference) return ref;

    return doc(
      this.firestore,
      "users",
      ref.userId,
      "interviews",
      ref.interviewId
    ) as DocumentReference<IInterviewAttributes>;
  }

  /**
   * This function returns a reference to a collection of interviews for a given user.
   * @param {string} userId - string - the user id of the user who owns the interview
   * @returns A CollectionReference of type IInterviewAttributes
   */
  private getCollectionRef(userId: string) {
    return collection(
      this.firestore,
      "users",
      userId,
      "interviews"
    ) as CollectionReference<IInterviewAttributes>;
  }

  /**
   * It creates a new interview in the database
   * @param {string} userId - string
   * @param {IBaseInterview} baseInterview - IBaseInterview
   * @returns a promise.
   */
  async create(userId: string, baseInterview: IBaseInterview) {
    const collectionRef = this.getCollectionRef(userId);

    const interview: IInterviewAttributes = {
      ...baseInterview,
      completedAt: null,
      reviewedAt: null,
      createdAt: Timestamp.now(),
    };

    return addDoc(collectionRef, interview);
  }

  /**
   * This function fetches all the documents in a collection and returns them as an array.
   * @param {string} userId - string - the user id of the user whose interviews we want to fetch
   * @returns An array of documents.
   */
  async fetchUserInterviews(userId: string) {
    const collectionRef = this.getCollectionRef(userId);

    return getDocs(collectionRef);
  }

  /**
   * It returns a promise that resolves to a document snapshot
   * @param {TInterviewDocumentReference} ref - TInterviewDocumentReference
   * @returns A promise that resolves to a document snapshot.
   */
  async fetchInterview(ref: TInterviewDocumentReference) {
    const docRef = this.getDocRef(ref);

    return getDoc(docRef);
  }

  /**
   * This function returns a promise that resolves to an array of documents from the collection group.
   * @returns An array of objects.
   */
  async getAllInterviews() {
    const groupQuery = query(this.getCollectionGroupRef());

    return getDocs(groupQuery);
  }
}

export default new InterviewService();
