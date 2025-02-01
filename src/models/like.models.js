import { Schema, model } from 'mongoose';

const likeSchema = new Schema({
    // either of Video, comment or tweet will be assigned others are null.
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet',
  },
});

const Like = model('Like', likeSchema);

export default Like;
