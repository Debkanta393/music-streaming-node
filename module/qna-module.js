import mongoose from "mongoose"

const qnaSchema = new mongoose.Schema({

    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    question: { type: String, required: true },
    answer: { type: String },
    askedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date }

})


const QNA = new mongoose.model("QNA", qnaSchema)
export default QNA;