class RoleLandingSystem {
    constructor() {
        this.roleRoutes = {
            investigator: { path: "dashboard-investigator.html", title: "My Open Cases" },
            forensic_analyst: { path: "dashboard-analyst.html", title: "Evidence Analysis Queue" },
            legal_professional: { path: "dashboard-legal.html", title: "Cases Pending Review" },
            admin: { path: "admin.html", title: "System Overview" }
        };
    }

    async redirectToRoleDashboard() {
        const userRole = this.getCurrentUserRole();
        if (!userRole) {
            window.location.href = "index.html";
            return;
        }
        const roleRoute = this.roleRoutes[userRole];
        if (roleRoute) {
            window.location.href = roleRoute.path;
        } else {
            window.location.href = "dashboard.html";
        }
    }

    getCurrentUserRole() {
        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return null;
        const userData = JSON.parse(localStorage.getItem("evidUser_" + currentUser) || "{}");
        return userData.role;
    }
}

window.roleLandingSystem = new RoleLandingSystem();