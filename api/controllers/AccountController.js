/**
 * AccountController
 *
 * @description :: Server-side logic for managing accounts
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  index: function(req, res) {
    res.json(req.session.user);
  },


  login: function(req, res) {
    res.view('login');
  }


};

