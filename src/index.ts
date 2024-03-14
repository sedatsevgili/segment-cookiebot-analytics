const segmentCookieBotAnalyticsWrapper = async (): Promise<void> => {
    if (!window.analytics) {
        console.error("Segment is not loaded");
        return;
    }

    const segmentKey = "<YOUR_SEGMENT_KEY>";
    const destinationCategoryMapping: Record<string, string> = {
        CRM: "preferences",
        "Customer Success": "preferences",
        "Feature Flagging": "preferences",
        "A/B Testing": "statistics",
        Analytics: "statistics",
        Attribution: "statistics",
        "Heatmaps & Recordings": "statistics",
        "Performance Monitoring": "statistics",
        "Tag Managers": "statistics",
        Advertising: "marketing",
        "Deep Linking": "marketing",
        Email: "marketing",
        "Email Marketing": "marketing",
        Livechat: "marketing",
        "Marketing Automation": "marketing",
        Personalization: "marketing",
        "Raw Data": "marketing",
        Referrals: "marketing",
        "Security & Fraud": "marketing",
        "SMS & Push Notifications": "marketing",
        Surveys: "marketing",
        Video: "marketing",
    };

    const segmentWrapper = async (): Promise<void> => {
        const segmentConsent = true;
        const defaultConsent = false;

        /**
         * Fetch destinations from Segment
         */
        const destinations = await fetchDestinations();

        const cookieConsent = getCookie("CookieConsent");
        if (null === cookieConsent) {
            window.analytics.page();
            return;
        }

        const consent = JSON.parse(convertToSafeJSON(cookieConsent));
        if (!consent) {
            window.analytics.page();
            return;
        }

        let destinationPreferences: Record<string, boolean> = {
            "Segment.io": segmentConsent,
        };
        for (let destination of destinations) {
            const destinationCategory = destination.category;
            if (typeof destinationCategory !== "string") {
                destinationPreferences[destination.name] = defaultConsent;
                continue;
            }
            if (!destinationCategoryMapping[destinationCategory]) {
                destinationPreferences[destination.name] = defaultConsent;
                continue;
            }
            const consentCategory =
                destinationCategoryMapping[destinationCategory];
            destinationPreferences[destination.name] = consent[consentCategory];
        }

        const plugin = {
            name: "Cookiebot Consent",
            type: "enrichment",
            version: "1.0.0",
            isLoaded: () => true,
            load: () => Promise.resolve(),
            page: (ctx: any) => {
                ctx.updateEvent(
                    (ctx.event.integrations = destinationPreferences),
                );
            },
            track: (ctx: any) => {
                ctx.updateEvent(
                    (ctx.event.integrations = destinationPreferences),
                );
            },
            identify: (ctx: any) => {
                ctx.updateEvent(
                    (ctx.event.integrations = destinationPreferences),
                );
            },
        };

        /**
         * Add source middleware
         */
        window.analytics.register(plugin);
        window.analytics.page();
    };

    const getCookie = (key: string): string | null => {
        const name = key + "=";
        const decodedCookie = decodeURIComponent(document.cookie);

        const ca = decodedCookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    };

    const convertToSafeJSON = (cookie: string): string => {
        return cookie.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
    };

    const fetchDestinations = async (): Promise<
        { name: string; category: string }[]
    > => {
        const response = await fetch(
            `https://cdn.segment.io/v1/projects/${segmentKey}/integrations`,
        );
        const data = await response.json();

        return data.map((destination: any) => ({
            name: destination.name,
            category: destination.category,
        }));
    };

    segmentWrapper();
};

segmentCookieBotAnalyticsWrapper();
