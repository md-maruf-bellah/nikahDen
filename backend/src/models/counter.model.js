import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, default: 0 },
});

/** Atomic next-value increment. `session` optional (transactions). */
export async function getNextSequence(name, session = null) {
  const doc = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session: session ?? undefined }
  );
  return doc.seq;
}

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
