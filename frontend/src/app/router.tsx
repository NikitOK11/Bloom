import { createBrowserRouter } from "react-router-dom";

import { EventDetailPage } from "../pages/EventDetailPage/EventDetailPage";
import { EventsPage } from "../pages/EventsPage/EventsPage";
import { HomePage } from "../pages/HomePage/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OlympiadsPage } from "../pages/OlympiadsPage/OlympiadsPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/events",
        element: <EventsPage />,
    },
    {
        path: "/events/:eventId",
        element: <EventDetailPage />,
    },
    {
        path: "/olympiads",
        element: <OlympiadsPage />,
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);
