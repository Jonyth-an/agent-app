import { connectionMongo, getMongoModel } from '../../common/mongo';
const { Schema } = connectionMongo;

const UserAppSchema = new Schema({
  openid: {
    type: String,
    index: true
  },
  unionid: {
    type: String,
    index: true
  },
  appId: {
    type: String,
    ref: 'app',
    index: true,
    required: true
  },
  chatId: {
    type: String,
    ref: 'chat',
    index: true
  },
  updateTime: {
    type: Date,
    default: () => new Date()
  }
});

// 修改索引，确保至少有 openid 或 unionid 之一
UserAppSchema.pre('save', function (next) {
  if (!this.openid && !this.unionid) {
    next(new Error('openid or unionid is required'));
  }
  next();
});

// 创建复合索引，确保 openid/unionid + appId + chatId 的组合唯一
UserAppSchema.index({ openid: 1, appId: 1, chatId: 1 }, { unique: true });
UserAppSchema.index({ unionid: 1, appId: 1, chatId: 1 }, { unique: true });

export const UserApp = getMongoModel('UserApp', UserAppSchema);
