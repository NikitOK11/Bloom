import { createBrowserRouter } from "react-router-dom";

import { EventDetailPage } from "../pages/EventDetailPage/EventDetailPage";
import { EventsPage } from "../pages/EventsPage/EventsPage";
import { HomePage } from "../pages/HomePage/HomePage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OlympiadsPage } from "../pages/OlympiadsPage/OlympiadsPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { SignupPage } from "../pages/SignupPage/SignupPage";
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
