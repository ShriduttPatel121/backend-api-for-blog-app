const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find().countDocuments()
  .then(count => {
    totalItems = count;
    return Post.find().skip((currentPage -1) * perPage).limit(perPage);
  })
  .then(posts => {
    res.status(200).json({posts : posts, totalItems : totalItems});
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error)
  });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const error = new Error('failed validation');
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('No image found');
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path; 
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl : imageUrl
  });

  post.save()
  .then(result => {
    return User.findById(req.userId)
  })
  .then(user => {
    creator = user;
    user.posts.push(post);
    return creator.save();
  })
  .then (result => {
    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator : {_id : creator._id, name : creator.name}
      });
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
  .then(post => {
    if (!post) {
      const error = new Error('No post found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({post : post});
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.body.image;
  console.log(postId)

  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const error = new Error('failed validation');
    error.statusCode = 422;
    throw error;
  }

  
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No image found');
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
  .then(post => {
    if(!post) {
    console.log('post not found');
    const error = new Error('No post found');
    error.statusCode = 404;
    throw error;
    }
    
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title,
    post.imageUrl = imageUrl;
    post.content = content;
    return post.save();
  })
  .then(result => {
    res.status(200).json({post : result})
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  });
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
  .then(post => {
    if(!post) {
      console.log('post not found');
      const error = new Error('No post found');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    return Post.findOneAndRemove(postId)
  })
  .then(result => {
    return User.findById(req.userId)
  })
  .then(user => {
    user.posts.pull(postId);
    return user.save();
  })
  .then(result => {
    res.status(200).json({message : "successfully deleted"});
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  });
}

const clearImage = filePath => {
  const filepath = path.join( __dirname, '..', filePath);
  fs.unlink(filepath, e => {console.log(e)});
}

//assignment code

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
  .then(user => {
    if(!user) {
      const error = new Error('No user fonund');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({ status : user.status })
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  });
}

exports.updateStatus = (req, res, next) => {
  const upStatus = req.body.updatedStatus;
  User.findById(req.userId)
  .then(user => {
    user.status = upStatus;
    return user.save();
  })
  .then(reult => {
    res.status(200).json({message : 'status updated'});
  })
  .catch(error => {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    return next(error);
  });
}