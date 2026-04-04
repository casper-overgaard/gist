import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { Session } from "@signalboard/domain";

// Note: this query requires createdAt to be indexed. Firestore auto-indexes
// single fields, so no manual composite index should be needed.
export async function getRecentSessions(): Promise<Session[]> {
  const q = query(
    collection(db, "sessions"),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => doc.data() as Session);
}
