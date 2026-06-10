import { createProductReview, getReviewsForProduct } from "../services/review.service.js";

export const add = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await createProductReview({
      userId,
      productId: parseInt(productId, 10),
      rating: ratingVal,
      comment,
    });

    res.status(201).json({ message: "Review added successfully",review});
  } catch (error) {
    next(error);
  }
};


export const getByProduct= async(req,res,next)=>{
    try{
        const {productId}=req.params;
        const reviews=await getReviewsForProduct(parseInt(productId,10));
        res.status(200).json(reviews);
    }
    catch(error){
        next(error);
    }
}
