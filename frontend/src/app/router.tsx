import { createBrowserRouter } from "react-router-dom";

import { EventDetailPage } from "../pages/EventDetailPage/EventDetailPage";
import { EventsPage } from "../pages/EventsPage/EventsPage";
import { HomePage } from "../pages/HomePage/HomePage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OlympiadsPage } from "../pages/OlympiadsPage/OlympiadsPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { SignupPage } from "../pages/SignupPage/SignupPage";
import { TeamCreatePage } from "../pages/TeamCreatePage/TeamCreatePage";
import { TeamDetailPage } from "../pages/TeamDetailPage/TeamDetailPage";
import { AppLayout } from "../shared/ui/AppLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "events",
                element: <EventsPage />,
            },
            {
                path: "events/:eventId",
                element: <EventDetailPage />,
            },
            {
                path: "teams/new",
                element: <TeamCreatePage />,
            },
            {
                path: "teams/:teamId",
                element: <TeamDetailPage />,
            },
            {
                path: "olympiads",
                element: <OlympiadsPage />,
            },
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "signup",
                element: <SignupPage />,
            },
            {
                path: "profile",
                element: <ProfilePage />,
            },
            {
                path: "*",
                element: <NotFoundPage />,
            },
        ],
    },
]);
