const userModel = require('../models/users.model');
const requestModel = require('../models/requests.model');
const ObjectId = require("mongoose").Types.ObjectId;

// GET /follows/following
const fetchFollowing = async (req, res) => {
    const { user_id } = req.query;
    const user = user_id ? ObjectId.isValid(user_id) ? await userModel.findById(user_id) : null : null;
    if (!user) return res.status(404).send({ error: 'User not found.' });
    const following = await userModel.find({ _id: { $in: user.following } }).select({ "_id": 1, "username": 1});
    return res.status(200).send(following);
}

// GET /follows/followers
const fetchFollowers = async (req, res) => {
    const { user_id } = req.query;
    const user = user_id ? ObjectId.isValid(user_id) ? await userModel.findById(user_id) : null : null;
    if (!user) return res.status(404).send({ error: 'User not found.' });
    const followers = await userModel.find({ _id: { $in: user.followers } }).select({ "_id": 1, "username": 1});
    return res.status(200).send(followers);
}

// POST /follows/request
const requestUser = async (req, res) => {
    const { id } = req.user;
    const { user_id } = req.body;
    const user = id ? ObjectId.isValid(id) ? await userModel.findById(id) : null : null;
    if (!user) return res.status(404).send({ error: 'User not found.' });
    if (!user_id) return res.status(404).send({ error: 'Not user to follow.' });
    if (!ObjectId.isValid(user_id)) return res.status(500).send({ error: 'Invalid user_id.' });
    const result =  await requestModel.find({requester: id, requested: user_id});
    if (result.length) return res.status(400).send({ error: 'The follow request already exists.' });
    if (String(user._id) === user_id) return res.status(500).send({ error: 'An user cannot follow itself.' });
    if (ObjectId(user_id) in user.following) return res.status(400).send({ error: 'The user is already being followed.' });
    const request = new requestModel({
        requester: id,
        requested: user_id
    });
    await request.save();
    return res.status(200).send({});
}

// POST /follows/response
const responseUser = async (req, res) => {
    const { id } = req.user;
    const { request_id, action } = req.body;
    const request = request_id ? ObjectId.isValid(request_id) ? await requestModel.findById(request_id) : null : null;
    if (!request || !action) return res.status(400).send({ error: 'Invalid request_id or action.' });
    if (id === String(request.requested)) {
        if (request.status === 'accepted') return res.status(400).send({ error: 'The user has already accepted the follow request.' });
        if (request.status === 'rejected') return res.status(400).send({ error: 'The user has already rejected the follow request.' });
        switch (action) {
            case 'accept':
                await userModel.findByIdAndUpdate(request.requester, { $push: { following: id } });
                await userModel.findByIdAndUpdate(id, { $push: { followers: request.requester } });
                await requestModel.findByIdAndUpdate(request_id, { status: 'accepted' });
                return res.status(200).send({});
            case 'reject':
                await requestModel.findByIdAndUpdate(request_id, { status: 'rejected' });
                return res.status(200).send({});
            default:
                return res.status(500).send({ error: 'Invalid action.' });
        }
    }
    return res.status(403).send({ error: 'Access denied.' });
}

module.exports = {
    fetchFollowing, fetchFollowers, requestUser, responseUser
}
