const express = require("express");
const router = express.Router();
const UserRoutes = require("../modules/user/user.routes");
const AdminRoutes = require("../modules/admin/admin.routes");
const ManageRoutes = require("../modules/manage-web/manage.routes");
const DashboardRoutes = require("../modules/dashboard/dashboard.routes");
const PaymentRoutes = require("../modules/payment/payment.routes");
const categoryRoutes = require("../modules/category/category.route");
const auctionRoutes = require("../modules/auction/auction.routes");
const bookmarkRoutes = require("../modules/bookmark/bookmark.route");
const ShippingRoutes = require("../modules/shippingAddress/shipping.routes");
const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/auction",
    route: auctionRoutes,
  },
  {
    path: "/bookmark",
    route: bookmarkRoutes,
  },
  {
    path: "/manage",
    route: ManageRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/shipping",
    route: ShippingRoutes,
  },
];

// Apply routes to the router
moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
