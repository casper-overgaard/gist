import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadAssetImage(sessionId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  
  // Create a reference in the session's folder
  const storageRef = ref(storage, `sessions/${sessionId}/${fileName}`);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Get and return the public URL
  return await getDownloadURL(storageRef);
}
