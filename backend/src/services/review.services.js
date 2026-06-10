import { User, Review, Product } from "../models";

export const createProductReview= async({userId,productId,rating,comment})=>{
    const product = await Product.findByPk(productId);
    if(!product){
        const error=new Error("Product Not Found");
        error.status=404;
        throw error;
    }
    const exists= await Review.findOne({where: {userId,productId}});
    if(exists){
        const error=new Error("lready Reviewed");
        error.status=400;
        throw error;
    }

    return await Review.create({userId, productId, rating, comment});
};


export const getReviewsForProduct= async (productId)=>{
    return await Review.findAll({
        where: {productId},
        include: [
            {
                model: User,
                attributes: ["id","name","email"],
            },
        ],
        order:[["createdAt","DESC"]],
    });
};
