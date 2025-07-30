const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: {
          message: 'Validation Error',
          details: errorMessage
        }
      });
    }
    
    next();
  };
};

// Validation schemas
const recommendationSchema = Joi.object({
  city: Joi.string().required().min(2).max(100),
  adults: Joi.number().integer().min(0).max(6).required(),
  kids: Joi.number().integer().min(0).max(6).required(),
  hasDog: Joi.boolean().required(),
  hasCar: Joi.boolean().required(),
  travelTime: Joi.number().integer().min(15).max(90).when('hasCar', {
    is: false,
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  activities: Joi.array().items(
    Joi.string().valid(
      'Hiking',
      'Beach',
      'Playgrounds',
      'Scenic Drives',
      'Shopping',
      'Farmers Markets',
      'Picnic Areas',
      'Breweries',
      'Museums',
      'Parks',
      'Restaurants',
      'Coffee Shops'
    )
  ).min(1).max(8).required()
});

const feedbackSchema = Joi.object({
  packId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  feedback: Joi.string().optional().max(500)
});

const placeSearchSchema = Joi.object({
  query: Joi.string().required().min(2).max(100),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  radius: Joi.number().integer().min(1000).max(50000).optional(),
  types: Joi.array().items(Joi.string()).optional()
});

module.exports = {
  validateRequest,
  recommendationSchema,
  feedbackSchema,
  placeSearchSchema
}; 