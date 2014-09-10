/**
* Profile.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    service: {
      type: 'string',
      required: true
    },

    account: {
      model: 'account'
    },

    // What type of social service/oAuth provider this is
    serviceID: {
      type: 'string',
      required: true
    },

    // Access token for oAuth access
    accessToken: {
      type: 'string',
      required: true
    },

    // Username on service
    username: {
      type: 'string'
    },

    // Service specific email
    email: {
      type: 'email'
    },

    // Where can we find an avatar for this profile
    avatar: {
      type: 'url'
    }

  }
};

