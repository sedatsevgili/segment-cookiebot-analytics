const segmentCookieBotAnalyticsWrapper = async (): Promise<void> => {
    if (!window.analytics) {
        console.error("Segment is not loaded");
        return;
    }

    const cookieBotMiddleware:Middleware = ({ payload, next}) => {
        const cookieConsent = getCookie("CookieConsent");
        if (null === cookieConsent) {
            return next(payload);
        }

        const consent = JSON.parse(convertToSafeJSON(cookieConsent));
        if (!consent) {
            return next(payload);
        }

        payload.obj.context = {
            ...payload.obj.context,
            consent: {
                categoryPreferences: {
                    marketing: consent.marketing || false,
                    necessary: consent.necessary || false,
                    preferences: consent.preferences || false,
                    statistics: consent.statistics || false,
                },
            },
        };
        return next(payload);
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

    window.analytics.addSourceMiddleware(cookieBotMiddleware);
    window.analytics.page();
};

segmentCookieBotAnalyticsWrapper();
