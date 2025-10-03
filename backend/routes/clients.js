const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error while fetching clients' });
  }
});

// POST /api/clients - Create a new client
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      notes,
      status
    } = req.body;

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const newClient = new Client({
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      notes,
      status: status || 'Active'
    });

    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating client' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error while deleting client' });
  }
});

// GET /api/clients/:id - Get a single client
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Server error while fetching client' });
  }
});

module.exports = router;