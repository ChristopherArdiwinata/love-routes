"use client";
import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Search,
  Navigation,
  MapPin,
  Clock,
  Route,
  X,
  Loader2,
  Users,
  MessageCircle,
  Shield,
  Heart,
  Train,
  User,
  AlertTriangle,
  Eye,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 *
 * Plan:
 * FIRST State: user inputs the location where they want to go (Google map Plan)
 * 1. Set up Google Maps
 * 2. Make sure input boxes work with autocomplete
 * 3. Calculate route and display on map
 * 4. Show route info (distance, duration, etc)
 * 5. Add travel mode selection (walking, public transport)
 * 6. Add current location button
 * 7. Add swap button
 * 8. Add clear button
 *
 * SECOND State: page is loading the outcome.
 * 1. loading page
 * 2. while loading, send the request + data to backend
 * 3. receive the response from backend
 *
 * THIRD State: show the outcome.
 * 1. receive the route from backend
 * 2. display the route on map
 *
 */

const AutocompleteInput = ({
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  onSelect,
  autocompleteService,
  sessionToken,
  className = "",
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // drop down thing that shows when u type
  const fetchSuggestions = debounce(async (input) => {
    if (!autocompleteService || !input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    const request = {
      input: input,
      sessionToken: sessionToken,
      types: ["establishment", "geocode"],
      componentRestrictions: { country: ["au"] },
    };

    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  }, 300);

  useEffect(() => {
    if (value) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.description);
    onSelect && onSelect(suggestion);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={suggestionsRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          )}
          {!isLoading &&
            suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const MapRouteSearch = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState("TRANSIT");

  //may not be needed
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  /* const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); */

  //scrolling draft1
  /* useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100); // Show floating logo after 100px scroll
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); */

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      try {
        await loader.importLibrary("maps");
        await loader.importLibrary("places");

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: -33.888, lng: 151.186 }, // TODO: zoom in more to usyd if we have more time.
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }],
            },
          ],
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          draggable: true,
          panel: null,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        const autocompleteServiceInstance =
          new google.maps.places.AutocompleteService();
        const sessionTokenInstance =
          new google.maps.places.AutocompleteSessionToken();

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setAutocompleteService(autocompleteServiceInstance);
        setSessionToken(sessionTokenInstance);

        // THIS IS FOR  route changes when user drags the route ( do nottouch )
        directionsRendererInstance.addListener("directions_changed", () => {
          const directions = directionsRendererInstance.getDirections();
          updateRouteInfo(directions);
        });
      } catch (error) {
        setError("Failed to load Google Maps. Please check your API key.");
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, []);

  const calculateRoute = async () => {
    if (!directionsService || !directionsRenderer || !origin || !destination) {
      setError("Please enter both origin and destination");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode[travelMode],
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      };
      let temp = await getTransitRoute(origin, destination);
      let tempOrigin = temp.firstTrainStation || origin;
      let tempDestination = temp.lastTrainStation || destination;
      directionsService.route(request, async (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          updateRouteInfo(result);

          // Send route data to backend
          await sendRouteToBackend(tempOrigin, tempDestination);
        } else {
          setError(`Could not calculate route: ${status}`);
        }
        setIsLoading(false);
      });
    } catch (error) {
      setError("Error calculating route");
      setIsLoading(false);
    }
  };

  const updateRouteInfo = (directions) => {
    const route = directions.routes[0];
    if (route) {
      const leg = route.legs[0];
      setRouteInfo({
        distance: leg.distance.text,
        duration: leg.duration.text,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
      });
    }
  };

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    setRouteInfo(null);
    setOrigin("");
    setDestination("");
    setError("");
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };
  async function getTransitRoute(origin, destination) {
    try {
      const url = `/api/transit-route?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Transit route API error:", data.error);
        return { firstTrainStation: null, lastTrainStation: null };
      }

      console.log("Train stations:", data);
      return data;
    } catch (error) {
      console.error("Error in getTransitRoute:", error);
      return { firstTrainStation: null, lastTrainStation: null };
    }
  }

  // Send route data to backend ( will be receiving an obj back with list of users and their match percentage)
  // THIS IS CRUCIAL....
  const sendRouteToBackend = async (startPoint, destinationPoint) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const routeData = {
        userId: user.id,
        startPoint: startPoint,
        destination: destinationPoint,
        travelMode: travelMode,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        console.error("Failed to save route to backend");
      }
    } catch (error) {
      console.error("Error sending route to backend:", error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              setOrigin(results[0].formatted_address);
            }
          });

          // Center the map on current location :)))
          if (map) {
            map.setCenter({ lat, lng });
            map.setZoom(14);
          }
        },
        (error) => {
          setError("Could not get your current location");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  };

  return (
    <div>
      {/* floating nameee */}
      <div
        style={{ backgroundColor: "#FFC14F" }}
        className="fixed border-b-3 border-r-3 border-black-500 z-50"
      >
        <Link
          href="/dashboard"
          className="flex items-center space-x-2  backdrop-blur-sm px-4 py-2 transition-all duration-200"
        >
          <Image
            src="/commutuals-img-cropped.png"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto mb-2 mr-2"
          />
        </Link>
      </div>
      {/* headerrrr */}
      <header className="bg-white">
        <div className="max-w-1xl mx-auto px-4 sm:px-9 lg:px-8 h-17">
          <div className="flex justify-between items-center h-16">
            {/* Empty space for logo no remove */}
            <div className="w-40"></div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="/dashboard"
                className="text-black-600 hover:text-gray-700 hover:underline cursor-pointer px-6 py-2 rounded-md text-xl font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/routes"
                className="text-black-600 hover:text-gray-700 hover:underline cursor-pointer px-6 py-2 rounded-md text-xl font-medium transition-colors"
              >
                My Routes
              </Link>

              <Link
                href="/settings"
                className="text-black-600 hover:text-gray-700 hover:underline cursor-pointer px-6 py-2 rounded-md text-xl font-medium transition-colors"
              >
                Settings
              </Link>
            </nav>

            {/* Right side*/}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Link
                  href="/"
                  className="text-black-600 hover:text-gray-700 hover:underline cursor-pointer px-6 py-2 rounded-md text-xl font-medium transition-colors"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* map and allat */}
      <div className="w-full max-w-7xl mx-auto p-4">
        {/* this a big map */}
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="relative">
            <div ref={mapRef} className="w-full h-96 lg:h-[600px]" />
          </div>

          <div className="p-6">
            <div className="grid grid-cols-10 gap-6 mb-6 items-stretch">
              <div className="col-span-4">
                <AutocompleteInput
                  value={origin}
                  onChange={setOrigin}
                  placeholder="Enter starting point"
                  icon={Search}
                  autocompleteService={autocompleteService}
                  sessionToken={sessionToken}
                />
              </div>

              <div className="col-span-4">
                <AutocompleteInput
                  value={destination}
                  onChange={setDestination}
                  placeholder="Enter destination"
                  icon={MapPin}
                  autocompleteService={autocompleteService}
                  sessionToken={sessionToken}
                />
              </div>

              <div className="col-span-2">
                <button
                  onClick={calculateRoute}
                  disabled={isLoading || !origin || !destination}
                  className="h-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                  <span>{isLoading ? "Finding Route..." : "Get Route"}</span>
                </button>{" "}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={getCurrentLocation}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <Navigation className="h-4 w-4" />
                <span>Current Location</span>
              </button>

              <button
                onClick={swapLocations}
                disabled={!origin || !destination}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                ⇄ Swap
              </button>

              {/* <button
                onClick={clearRoute}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </button> */}
            </div>
          </div>

          {routeInfo && (
            <div className="mt-6 p-16">
              <h3 className="font-bold font-xl text-black-900 mb-4 flex items-center">
                <Route className="h-5 w-5 mr-2 text-blue-600" />
                Route Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">📏</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Distance</div>
                    <div className="font-semibold text-gray-900">
                      {routeInfo.distance}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-900">
                      {routeInfo.duration}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>From:</strong> {routeInfo.startAddress}
                </div>
                <div>
                  <strong>To:</strong> {routeInfo.endAddress}
                </div>
              </div>
            </div>
          )}

          {/* filler */}
          <section
            style={{ backgroundColor: "#F66E44" }}
            className="py-40 mt-4"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-7xl font-bold text-black-900 mb-4">
                  How It Works
                </h2>
                <p className="text-lg text-black-600">
                  Making friends on your journey has never been easier
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    1. Enter Your Route
                  </h3>
                  <p className="text-black-600">
                    Tell us where you're traveling from and to. We'll find
                    others on the same journey.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    2. Find Commutuals
                  </h3>
                  <p className="text-black-600">
                    Browse profiles of fellow travelers on your route and
                    connect with like-minded people.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">3. Start Chatting</h3>
                  <p className="text-black-600">
                    Break the ice with a message and turn your solo journey into
                    a social adventure.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Why Choose Commutuals?
                </h2>
                <p className="text-lg text-gray-700">
                  The safest and most fun way to meet people while traveling
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="space-y-8">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          Verified Profiles
                        </h3>
                        <p className="text-gray-700">
                          All users are verified through ticket validation to
                          ensure you're meeting real travelers.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          Real-Time Matching
                        </h3>
                        <p className="text-gray-700">
                          Connect with people on the same train, same day. No
                          more awkward small talk with strangers.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Heart className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          Interest-Based Matching
                        </h3>
                        <p className="text-gray-700">
                          Find people who share your hobbies, work in similar
                          fields, or just love good conversation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-2xl p-8 text-center">
                  <Train className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">
                    Turn Travel Time Into Social Time
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Whether it's a 2-hour commute or a cross-country adventure,
                    make every journey memorable.
                  </p>
                  <button className="bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all">
                    Start Your Journey
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Success Stories Section */}
          <section className="py-16 bg-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Success Stories
                </h2>
                <p className="text-lg text-gray-600">
                  Real connections made on real journeys
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Sarah & Mike</h4>
                      <p className="text-sm text-gray-500">
                        London → Edinburgh
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "Met on the 8 AM train and ended up talking the entire
                    4.5-hour journey. Now we're planning our next adventure
                    together!"
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">James</h4>
                      <p className="text-sm text-gray-500">Daily Commuter</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "Turned my boring daily commute into the best part of my
                    day. Made 3 close friends in my first month!"
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Emma & Lisa</h4>
                      <p className="text-sm text-gray-500">
                        Manchester → London
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "Both traveling for job interviews, we helped each other
                    prepare and both got the jobs. Best travel companion ever!"
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Safety Section */}
          <section
            style={{ backgroundColor: "#99C1B1" }}
            className="py-16 bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Your Safety Comes First
                </h2>
                <p className="text-lg text-gray-600">
                  Built with comprehensive safety features for worry-free
                  connections
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold mb-2">ID Verification</h3>
                  <p className="text-sm text-gray-600">
                    All users verified with official ID and train tickets
                  </p>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Report System</h3>
                  <p className="text-sm text-gray-600">
                    Easy reporting and blocking features for uncomfortable
                    situations
                  </p>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Profile Moderation</h3>
                  <p className="text-sm text-gray-600">
                    24/7 moderation team reviewing profiles and messages
                  </p>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Safe Messaging</h3>
                  <p className="text-sm text-gray-600">
                    In-app messaging keeps personal info private until you're
                    ready
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex">
                <div className="text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapRouteSearch;
