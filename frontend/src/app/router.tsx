import { createBrowserRouter } from "react-router-dom";

import { EventDetailPage } from "../pages/EventDetailPage/EventDetailPage";
import { EventsPage } from "../pages/EventsPage/EventsPage";
import { HomePage } from "../pages/HomePage/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OlympiadsPage } from "../pages/OlympiadsPage/OlympiadsPage";
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
                path: "*",
                element: <NotFoundPage />,
            },
        ],
    },
]);
