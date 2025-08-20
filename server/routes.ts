import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MongoStorage } from "./mongoStorage";
import passport from 'passport';
import { insertEventSchema, updateEventSchema } from "@shared/schema";
import { z } from "zod";

// Use MongoDB storage instead of in-memory storage
const mongoStorage = new MongoStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await mongoStorage.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get events by date
  app.get("/api/events/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const events = await mongoStorage.getEventsByDate(date);
      res.json(events);
    } catch (error) {
      console.error('Error fetching events by date:', error);
      res.status(500).json({ message: "Failed to fetch events for date" });
    }
  });

  // Search events
  app.get("/api/events/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const events = await mongoStorage.searchEvents(query);
      res.json(events);
    } catch (error) {
      console.error('Error searching events:', error);
      res.status(500).json({ message: "Failed to search events" });
    }
  });

  // Get events by category
  app.get("/api/events/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const events = await mongoStorage.getEventsByCategory(decodeURIComponent(category));
      res.json(events);
    } catch (error) {
      console.error('Error fetching events by category:', error);
      res.status(500).json({ message: "Failed to fetch events by category" });
    }
  });

  // Get single event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await mongoStorage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });





  // Timeline routes
  app.get("/api/timeline", async (req, res) => {
    try {
      const date = req.query.date as string;
      const timeline = await mongoStorage.getTimeline(date);
      res.json(timeline);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.get("/api/timeline/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const date = req.query.date as string;
      const timeline = await mongoStorage.getTimelineByUserId(userId, date);
      res.json(timeline);
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      res.status(500).json({ message: "Failed to fetch user timeline" });
    }
  });

  // Presence routes
  app.get("/api/presences", async (req, res) => {
    try {
      const presences = await mongoStorage.getPresences();
      res.json(presences);
    } catch (error) {
      console.error('Error fetching presences:', error);
      res.status(500).json({ message: "Failed to fetch presences" });
    }
  });

  app.get("/api/presences/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const presences = await mongoStorage.getPresencesByDate(date);
      res.json(presences);
    } catch (error) {
      console.error('Error fetching presences by date:', error);
      res.status(500).json({ message: "Failed to fetch presences for date" });
    }
  });

  app.get("/api/presences/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const presences = await mongoStorage.getPresencesByUserId(userId);
      res.json(presences);
    } catch (error) {
      console.error('Error fetching presences by user:', error);
      res.status(500).json({ message: "Failed to fetch user presences" });
    }
  });

  app.get("/api/presences/user/:userId/date/:date", async (req, res) => {
    try {
      const { userId, date } = req.params;
      const presences = await mongoStorage.getPresencesByUserIdAndDate(userId, date);
      res.json(presences);
    } catch (error) {
      console.error('Error fetching presences by user and date:', error);
      res.status(500).json({ message: "Failed to fetch user presences for date" });
    }
  });

  app.get("/api/timeline", async (req, res) => {
    try {
      const startTime = Date.now();
      const { date } = req.query;
      const timeline = await mongoStorage.getTimeline(date as string);
      const docCount = `[${timeline.length} entries]`;
      console.log(`${new Date().toLocaleTimeString()} [express] GET /api/timeline ${res.statusCode} in ${Date.now() - startTime}ms :: ${docCount}`);
      res.json(timeline);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  app.get("/api/timeline/:userId", async (req, res) => {
    try {
      const startTime = Date.now();
      const { userId } = req.params;
      const { date } = req.query;
      const timeline = await mongoStorage.getTimelineByUserId(userId, date as string);
      const docCount = `[${timeline.length} entries]`;
      console.log(`${new Date().toLocaleTimeString()} [express] GET /api/timeline/${userId} ${res.statusCode} in ${Date.now() - startTime}ms :: ${docCount}`);
      res.json(timeline);
    } catch (error) {
      console.error('Error fetching timeline for user:', error);
      res.status(500).json({ message: "Failed to fetch timeline for user" });
    }
  });

  // Auth routes
  app.get('/auth/discord', passport.authenticate('discord'));

  app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.redirect('/');
    });
  });

  app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
