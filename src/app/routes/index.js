const express = require("express");
const router = express.Router();
const UserRoutes = require("../modules/user/user.routes");
const AdminRoutes = require("../modules/admin/admin.routes");
const ManageRoutes = require("../modules/manage-web/manage.routes");
const DashboardRoutes = require("../modules/dashboard/dashboard.routes");
const PaymentRoutes = require("../modules/payment/payment.routes");

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
];

// Apply routes to the router
moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
