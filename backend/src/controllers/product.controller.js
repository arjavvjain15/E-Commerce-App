import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  } from "../services/product.services.js";
  import jwt from "jsonwebtoken";
  import { User } from "../models/index.js";
  
  const isAdminRequest = async (req) => {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) return false;
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
      const user = await User.findByPk(decoded.userId);
      return user && user.role === "admin";
    } catch (err) {
      return false;
    }
  };
  
  export const getAll = async (req, res, next) => {
    try {
      const { categoryId, search } = req.query;
      const includeDrafts = req.query.includeDrafts === "true" && (await isAdminRequest(req));
      const products = await getAllProducts({ categoryId, search, includeDrafts });
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  };

  export const getById= async(req,res,next)=>{
    try{
        const draft= await isAdminRequest(req);
        const product= await getProductById(req.params.id,{includeDrafts: draft});
        res.status(200).json(product);
    }
    catch(error){
        next(error);
    }
  }
  
  export const create = async (req, res, next) => {
    try {
      const { name, description, price, stock, imageUrl, originalName, categoryName, categoryId, status } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ message: "Product name and price are required" });
      }
  
      const product = await createProduct({
        name,
        description,
        price,
        stock,
        imageUrl,
        originalName,
        categoryName,
        categoryId,
        status,
      });
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      next(error);
    }
  };
  export const c= async(req,res,next)=>{
    try{
        const {name,description,price,stock,imageUrl,categoryName,categoryId,status}= req.body;
        if(!name||price==undefined){
            return res.status(400).json({message:"Product name and price are required"});
        }
        const product= await createProduct.create({
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryName,
            categoryId,
            status,
        });
        res.status(201).json({message:"Product created",product});
    }
    catch(error){
        next(error);
    }
  }
  export const update = async (req, res, next) => {
    try {
      const product = await updateProduct(req.params.id, req.body);
      res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
      next(error);
    }
  };
  
  export const remove = async (req, res, next) => {
    try {
      await deleteProduct(req.params.id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  export const download= async(req,res,next)=>{
    try{
        const product=await getProductById(req.params.id);
        if(!product) res.status(400).json({messgae:"Product not found"});
        const originalName=product.originalName || `${product.name}.jpg` ;
        const response =await fetch(product.imageUrl);                      //download from s3 (raw bytes)
        if(!response.ok){
            throw new Error(`Failed to fetch image from AWS S3 Bucket`);
        }
        const arrayBuffer= await response.arrayBuffer();                    //container to hold these raw bytes (for JS)
        const buffer=Buffer.from(arrayBuffer);                              //for node
        res.setHeader("Content-Disposition",`attachment; filename="${originalName}"`);
        res.setHeader("Content-Type",response.headers.get("content-type")||"application/octet-stream");  //tells the type of file downloaded from s3 
        res.send(buffer);
    }
    catch(error){
        next(error);
    }
  }
  
