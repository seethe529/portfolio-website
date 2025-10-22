# Extra-Orbital Solutions API Reference

## Overview

The Extra-Orbital Solutions API provides complete orbital governance functionality, from satellite tracking to tract registration. All endpoints return JSON responses and follow RESTful conventions.

**Base URL**: `http://localhost:3000/api`

## Authentication

Currently no authentication required for MVP demo. Production deployment will implement API key authentication.

## Endpoints

### 1. System Statistics

**GET** `/api/stats`

Returns real-time system statistics and collision risk assessment.

**Response**:
```json
{
  "total_tracts": 95904,
  "active_satellites": 12981,
  "available_tracts": 82923,
  "last_updated": "2024-01-15T10:30:00.000Z"
}
```

**Fields**:
- `total_tracts`: Total orbital tracts in system
- `active_satellites`: Currently tracked satellites with positions
- `available_tracts`: Tracts not currently occupied
- `last_updated`: ISO timestamp of last data update

---

### 2. Live Satellite Data

**GET** `/api/satellites`

Returns real-time satellite tracking data from PostgreSQL database.

**Response**:
```json
[
  {
    "satellite_id": "25544",
    "name": "ISS (ZARYA)",
    "altitude": 408.2,
    "inclination": 51.6,
    "longitude": -45.2,
    "latitude": 23.1
  }
]
```

**Fields**:
- `satellite_id`: NORAD catalog number
- `name`: Satellite common name
- `altitude`: Current altitude in kilometers
- `inclination`: Orbital inclination in degrees
- `longitude`: Current longitude in degrees
- `latitude`: Current latitude in degrees

---

### 3. Available Orbital Tracts

**GET** `/api/tracts/available`

Search for available orbital tracts matching mission parameters.

**Parameters**:
- `altitude` (required): Mission altitude in kilometers
- `inclination` (required): Orbital inclination in degrees

**Example Request**:
```
GET /api/tracts/available?altitude=550&inclination=53
```

**Response**:
```json
[
  {
    "tract_id": "LEO-A550-I53-RAAN0_5",
    "altitude_range": "525-575km",
    "inclination_range": "50-55°",
    "raan_range": "0-5°"
  }
]
```

**Fields**:
- `tract_id`: Unique orbital tract identifier
- `altitude_range`: Altitude boundaries in kilometers
- `inclination_range`: Inclination boundaries in degrees
- `raan_range`: RAAN boundaries in degrees

---

### 4. Satellite Registration

**POST** `/api/satellites/register`

Register a new satellite in an orbital tract. Completes the orbital governance workflow.

**Request Body**:
```json
{
  "satellite_name": "CommSat-1",
  "operator": "SpaceX",
  "tract_id": "LEO-A550-I53-RAAN0_5",
  "mission_type": "Communications"
}
```

**Required Fields**:
- `satellite_name`: Name of the satellite
- `operator`: Operating organization
- `tract_id`: Target orbital tract (from available tracts search)
- `mission_type`: One of: Communications, Earth Observation, Scientific Research, Navigation, Technology Demo

**Success Response** (200):
```json
{
  "registration_id": "REG-LEO-A550-I53-RAAN0_5-20240115103000",
  "satellite_name": "CommSat-1",
  "operator": "SpaceX",
  "tract_id": "LEO-A550-I53-RAAN0_5",
  "mission_type": "Communications",
  "status": "APPROVED",
  "registered_at": "2024-01-15T10:30:00.000Z",
  "tract_details": {
    "altitude_range": "525-575km",
    "inclination_range": "50-55°",
    "raan_range": "0-5°"
  }
}
```

**Error Response** (400):
```json
{
  "error": "Missing required field: satellite_name"
}
```

**Fields**:
- `registration_id`: Unique registration identifier
- `status`: Always "APPROVED" in MVP (future: PENDING, REJECTED)
- `registered_at`: ISO timestamp of registration
- `tract_details`: Complete orbital parameters for assigned tract

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters or missing required fields
- `404 Not Found`: Resource not found (invalid tract ID)
- `500 Internal Server Error`: Database or server error

Error responses include descriptive error messages:
```json
{
  "error": "Invalid tract ID"
}
```

## Rate Limiting

Currently no rate limiting in MVP. Production deployment will implement:
- 1000 requests/hour for unauthenticated requests
- 10000 requests/hour for authenticated API keys

## Database Integration

All endpoints connect directly to PostgreSQL database:
- **Database**: `extra_orbital`
- **Schema**: `dev`
- **Tables**: `tracts`, `tle_snapshots`
- **Spatial Engine**: PostGIS for geometric calculations

## Workflow Integration

The API supports complete orbital governance workflow:

1. **Discovery**: `GET /api/stats` - View system overview
2. **Search**: `GET /api/tracts/available` - Find suitable orbital spaces
3. **Registration**: `POST /api/satellites/register` - Complete governance process
4. **Monitoring**: `GET /api/satellites` - Track registered satellites

## Future Enhancements

Planned API extensions:
- Authentication and authorization
- Webhook notifications for tract status changes
- Bulk registration endpoints
- Historical satellite tracking data
- Collision prediction algorithms
- Automated compliance monitoring

## Support

For API support and integration assistance:
- **Documentation**: See `/docs` folder
- **Demo**: http://localhost:3000
- **Issues**: Contact Extra-Orbital Solutions team