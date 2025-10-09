import Reviews from "../module/review-module.js"


const getReviews = async (req, res) => {
    try {
        const productId = await req.params.id


        const review = await Reviews.find({ product: productId }).populate('user', 'name') // optional: populate user info
            .sort({ createdAt: -1 });
        if (!review) {
            return res.status(404).json({ message: "No review found" })
        }


        // If review exists
        return res.status(200).json({ review })
    } catch (error) {
        return res.status(500).json({ message: "Server error" })
    }
}


const addReview = async (req, res) => {
    try {
        const userId = await req.user._id
        const productId = await req.params.id
        console.log(req.body)
        const { rating, comment } = req.body

        if (!rating || !comment) {
            return res.status(400).json({ error: "Rating and comment are required." });
        }

        // Optional: prevent duplicate review from the same user
        const existingReview = await Reviews.findOne({ product: productId, user: userId });
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this product." });
        }

        // Add review
        const review = await Reviews.create({
            product: productId,
            user: userId,
            rating: rating,
            comment: comment
        })

        return res.status(200).json({ message: review })
    } catch (error) {
        console.log(error)
        return res.status(500).json("Internal server error")
    }
}


export { getReviews, addReview }
