import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './config'
import type { CustomerDetails, QuoteInput, QuoteResult, SavedQuote } from '../lib/pricingTypes'

const COL = 'quotes'

export async function saveQuote(
  customer: CustomerDetails,
  input: QuoteInput,
  result: QuoteResult,
): Promise<string> {
  const data = { customer, input, result, savedAt: new Date().toISOString() }
  const ref = await addDoc(collection(db, COL), data)
  return ref.id
}

export async function updateSavedQuote(
  id: string,
  customer: CustomerDetails,
  input: QuoteInput,
  result: QuoteResult,
): Promise<void> {
  await updateDoc(doc(db, COL, id), { customer, input, result, savedAt: new Date().toISOString() })
}

export async function fetchQuotes(): Promise<SavedQuote[]> {
  const q = query(collection(db, COL), orderBy('savedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedQuote))
}

export async function getQuote(id: string): Promise<SavedQuote | null> {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedQuote
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
