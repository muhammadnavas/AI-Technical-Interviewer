import { Schema, model } from 'mongoose';

const interviewSessionSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  candidateId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'ShortlistedCandidate'
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  recruiterId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  candidateDetails: {
    candidateName: {
      type: String,
      required: true
    },
    candidateEmail: {
      type: String,
      required: true
    },
    phoneNumber: String,
    companyName: String,
    role: String,
    techStack: [String],
    experience: String
  },
  sessionConfig: {
    scheduledStartTime: {
      type: Date,
      required: true
    },
    scheduledEndTime: {
      type: Date,
      required: true
    },
    timeZone: {
      type: String,
      default: 'UTC'
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    accessWindow: {
      beforeStart: { type: Number, default: 15 }, // minutes before start time
      afterEnd: { type: Number, default: 15 } // minutes after end time
    }
  },
  sessionStatus: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'expired', 'cancelled'],
    default: 'scheduled'
  },
  accessControl: {
    isActive: {
      type: Boolean,
      default: false
    },
    accessStartTime: Date,
    accessEndTime: Date,
    candidateJoinedAt: Date,
    candidateLeftAt: Date,
    totalTimeSpent: Number // in minutes
  },
  interviewData: {
    conversationHistory: [{
      role: {
        type: String,
        enum: ['system', 'assistant', 'user']
      },
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    metadata: {
      startTime: Date,
      endTime: Date,
      questionsAsked: { type: Number, default: 0 },
      answersReceived: { type: Number, default: 0 },
      codingTestsCompleted: { type: Number, default: 0 }
    },
    results: {
      fileName: String,
      savedAt: Date,
      resultSummary: String
    }
  },
  security: {
    accessToken: {
      type: String,
      required: true
    },
    ipRestrictions: [String], // Optional IP whitelist
    maxLoginAttempts: {
      type: Number,
      default: 3
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lastLoginAttempt: Date
  },
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    remindersSent: [Date],
    confirmationSentAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
interviewSessionSchema.index({ candidateId: 1, scheduledStartTime: 1 });
interviewSessionSchema.index({ sessionId: 1 });
interviewSessionSchema.index({ accessToken: 1 });
interviewSessionSchema.index({ sessionStatus: 1, 'sessionConfig.scheduledStartTime': 1 });

// Virtual for checking if session is currently accessible
interviewSessionSchema.virtual('isAccessible').get(function() {
  const now = new Date();
  const startTime = new Date(this.sessionConfig.scheduledStartTime);
  const endTime = new Date(this.sessionConfig.scheduledEndTime);
  const accessStart = new Date(startTime.getTime() - (this.sessionConfig.accessWindow.beforeStart * 60000));
  const accessEnd = new Date(endTime.getTime() + (this.sessionConfig.accessWindow.afterEnd * 60000));
  
  return now >= accessStart && now <= accessEnd && this.sessionStatus === 'scheduled';
});

// Method to activate session
interviewSessionSchema.methods.activateSession = function() {
  const now = new Date();
  this.sessionStatus = 'active';
  this.accessControl.isActive = true;
  this.accessControl.accessStartTime = now;
  this.accessControl.candidateJoinedAt = now;
  
  // Calculate access end time
  const endTime = new Date(this.sessionConfig.scheduledEndTime);
  const accessEnd = new Date(endTime.getTime() + (this.sessionConfig.accessWindow.afterEnd * 60000));
  this.accessControl.accessEndTime = accessEnd;
  
  return this.save();
};

// Method to complete session
interviewSessionSchema.methods.completeSession = function() {
  const now = new Date();
  this.sessionStatus = 'completed';
  this.accessControl.isActive = false;
  this.accessControl.candidateLeftAt = now;
  
  // Calculate total time spent
  if (this.accessControl.candidateJoinedAt) {
    const timeSpent = (now - this.accessControl.candidateJoinedAt) / (1000 * 60); // in minutes
    this.accessControl.totalTimeSpent = Math.round(timeSpent);
  }
  
  this.interviewData.metadata.endTime = now;
  
  return this.save();
};

// Method to check if session should be expired
interviewSessionSchema.methods.checkExpiry = function() {
  const now = new Date();
  const endTime = new Date(this.sessionConfig.scheduledEndTime);
  const accessEnd = new Date(endTime.getTime() + (this.sessionConfig.accessWindow.afterEnd * 60000));
  
  if (now > accessEnd && this.sessionStatus !== 'completed') {
    this.sessionStatus = 'expired';
    this.accessControl.isActive = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

export default model('InterviewSession', interviewSessionSchema);