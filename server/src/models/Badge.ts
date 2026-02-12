import { Schema, model, Document } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  criteriaType: "streak" | "weekly_goal" | "three_month_goal";
  criteriaValue: number;
  tier: "bronze" | "silver" | "gold";
}

const BadgeSchema = new Schema<IBadge>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  criteriaType: {
    type: String,
    enum: ["streak", "weekly_goal", "three_month_goal"],
    required: true,
  },
  criteriaValue: { type: Number, required: true },
  tier: { type: String, enum: ["bronze", "silver", "gold"], default: "bronze" },
});

export const Badge = model<IBadge>("Badge", BadgeSchema);
