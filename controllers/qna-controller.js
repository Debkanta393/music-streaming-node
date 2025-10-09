import QNA from "../module/qna-module.js"


const getQNA = async (req, res) => {
    try {
        const productId = await req.params.id

        const qna = await QNA.find({ product: productId });
        return res.status(200).json({ message: qna })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}


const addQNA = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.user._id
        let { question } = req.body
        console.log(question)

        if (!question) {
            return res.status(500).json({ message: "No question found" })
        }

        // Add question mark at the end of the question
        const askSign = question.charAt(question.length - 1)
        console.log(askSign)
        question = question.trim();
        if (!question.endsWith("?")) {
            question += "?";
        }


        // Question uploaded
        const qna = await QNA.create({
            product: productId,
            question: question,
            askedBy: userId
        })

        return res.status(200).json({ qna })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


export { getQNA, addQNA }