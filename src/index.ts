const segmentCookieBotAnalyticsWrapper = async (): Promise<void> => {
    const segmentKey = "NYjwC27fBFOHKjw2YEoiqeSvy5h5WVxP";
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

        const mainSegmentScript = `!function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="${segmentKey}";;analytics.SNIPPET_VERSION="5.2.0";
          analytics.load("${segmentKey}");
          }}();`;

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
        eval(mainSegmentScript);
        window.analytics.register(plugin);
        window.analytics.page();
    };

    const getCookie = (key: string): string | null => {
        const name = key + "=";
        //const tempDocumentCookie = `ajs_anonymous_id=c65b6ea2-d8af-4592-b137-cc182f2f9f0d; CookieConsent={stamp:%27v9pXC6IaWgwa9ujQb3ptRjCSW+3k049gal5jSdq7JVtIQX643OZy6g==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cmethod:%27explicit%27%2Cver:1%2Cutc:1709378704348%2Cregion:%27tr%27}; _gcl_au=1.1.1857340959.1709378704; _ga=GA1.1.980610445.1709378679; _ga_3ZGEP6KQF6=GS1.1.1709378676.1.0.1709378704.0.0.0`;
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
