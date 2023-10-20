const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;
const stripe = require('stripe')('sk_test_51Nunu7AGKiuzGf1eU9db3DHGDyGZjh5gt8Z2gZdPzQlElzGTrU8Dh4ZOaHBWIWnbHMIVWXLFBt6eKY34mJ36hTUd00FV8VR7DY');

exports.getProducts = (req, res, next) => {
  const page = +req.query.page;
  let totalItems;
  Product
    .find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip(( page-1 ) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil( totalItems / ITEMS_PER_PAGE )
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page;
  let totalItems;
  Product
    .find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip(( page-1 ) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil( totalItems / ITEMS_PER_PAGE )
      });
    })
    .catch(err => {
      console.log(err);
    }); 
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

// exports.getCheckout = (req, res, next) => {
//   let total = 0;
//   let products;
//   req.user
//     .populate('cart.items.productId')
//     .execPopulate()
//     .then(user => {
//      total = 0;
//      products = user.cart.items;
//       products.forEach(p => {
//         total += p.quantity * p.productId.price
//       })

//       return stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         line_items: products.map(p => {
//           return {
//             price: price_1NupEGGW6knyw4vjH4PE3OdF,
//             quantity: p.quantity
//           }
//         }),
//         success_url: req.protocol + '://' + req.get('host') + '/checkout/success', 
//         cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
//       });
//     })
//     .then(session => {
//       res.render('shop/checkout', {
//         path: '/checkout',
//         pageTitle: 'Checkout',
//         products: products,
//         totalSum: total,
//         sessionId: session.id
//       });
//     })
//     .catch(err => console.log(err));
// }

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if(!order){
      return next(new Error('No order found'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoice', invoiceName);

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
    
    // Create a write stream to save the PDF to a file
    const pdfStream = fs.createWriteStream(invoicePath);

    // Pipe the PDF document to the write stream
    pdfDoc.pipe(pdfStream);
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', {
      underline:true
    });

    pdfDoc.text('--------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc
        .fontSize(18)
          .text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price)
    })
    pdfDoc.text('-------');
    pdfDoc.fontSize(23).text('Total Price: $' + totalPrice)

    pdfDoc.end();

    // fs.readFile(invoicePath, (err, data) => {
    //   if(err){
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
    //   res.send(data);
    // })
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
    // file.pipe(res);
  }).catch(err => {
    next(err)
  })
}