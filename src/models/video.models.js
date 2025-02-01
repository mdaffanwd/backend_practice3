import { model, Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoFile: { type: String, required: true },
    thumbnail: { type: String, required: true },
    duration: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
    },
    owner: {
      type: Schema.Types.ObjectId,
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = model('Video', videoSchema);

export default Video;
