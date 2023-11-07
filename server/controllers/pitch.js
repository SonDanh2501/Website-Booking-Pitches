const Pitch = require('../models/pitch')
const asyncHandler = require('express-async-handler')
const slugify = require('slugify')

const createPitch = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0) throw new Error('Missing inputs')
    if (req.body && req.body.title) req.body.slug = slugify(req.body.title)
    const newPitch = await Pitch.create(req.body)
    return res.status(200).json({
        success: newPitch ? true : false,
        createPitch: newPitch ? newPitch : 'Can not create new pitch'
    })
})
const getPitch = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const pitch = await Pitch.findById(pid)
    return res.status(200).json({
        success: pitch ? true : false,
        createPitch: pitch ? pitch : 'Can not get pitch'
    })
})

//filtering , sorting & pagination

const getPitchs = asyncHandler(async (req, res) => {
    const queries = { ...req.query }
    // tách các trường đặc biệt ra khỏi query
    const exlcludeFields = ['limit', 'sort', 'page', 'fields']
    exlcludeFields.forEach(el => delete queries[el])
    //Format lại các operators cho đúng cú pháp mongoose
    let queryString = JSON.stringify(queries)
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`)
    const formartedQueries = JSON.parse(queryString)

    // Filtering
    if (queries?.title) formartedQueries.title = { $regex: queries.title, $options: 'i' }
    let queryCommand = Pitch.find(formartedQueries)

    //Sorting 
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        queryCommand = queryCommand.sort(sortBy)
    }

    // Fields litmitng
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ')
        queryCommand = queryCommand.select(fields)
    }

    //Pagination
    //limit : số object lấy về 1 lần gọi API
    //skip 2 (bỏ qua 2 cái đầu)
    // +2 => 2 
    const page = +req.query.page || 1
    const limit = +req.query.limit || process.env.LIMIT_PITCHS
    const skip = (page - 1) * limit
    queryCommand.skip(skip).limit(limit)

    // Executed query
    // Số lượng sân thỏa điều kiện 
    queryCommand.then(async (response) => {
        const counts = await Pitch.find(formartedQueries).countDocuments()
        return res.status(200).json({
            success: response ? true : false,
            counts,
            pitches: response ? response : 'Can not get pitchs'

        })
    }).catch((err) => {
        if (err) throw new Error(err, message)
    })

})

const updatePitch = asyncHandler(async (req, res) => {
    const { pid } = req.params
    if (req.body && req.body.title) req.body.slug = slugify(req.body.title)
    const updatePitch = await Pitch.findByIdAndUpdate(pid, req.body, { new: true })
    return res.status(200).json({
        success: updatePitch ? true : false,
        updatePitch: updatePitch ? updatePitch : 'Can not update pitch'
    })
})
const deletePitch = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const deletePitch = await Pitch.findByIdAndDelete(pid)
    return res.status(200).json({
        success: deletePitch ? true : false,
        deletePitch: deletePitch ? deletePitch : 'Can not delete pitch'
    })
})
const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { star, comment, pid } = req.body
    if (!star || !pid) throw new Error('Missing inputs')
    const ratingPitch = await Pitch.findById(pid)
    const alreadyRating = ratingPitch?.ratings?.find(el => el.postedBy.toString() === _id)
    console.log(alreadyRating)
    if (alreadyRating) {
        //update star and comment again
        await Pitch.updateOne({
            ratings: { $elemMatch: alreadyRating }
        }, {
            $set: { "ratings.$.star": star, "ratings.$.comment": comment }
        }, { new: true })
    } else {
        //add star and comment first time
        const response = await Pitch.findByIdAndUpdate(pid, {
            $push: { ratings: { star, comment, postedBy: _id } }
        }, { new: true })
    }


    //sumratings
    const updatedPitch = await Pitch.findById(pid)
    const ratingCount = updatedPitch.ratings.length
    const sumRatings = updatedPitch.ratings.reduce((sum, el) => sum + el.star, 0)
    updatedPitch.totalRatings = Math.round(sumRatings * 10 / ratingCount) / 10

    await updatedPitch.save()

    return res.status(200).json({
        status: true,
        updatedPitch
    })

})
const uploadImagesPitch = asyncHandler(async(req,res)=>{
    console.log(req.file)
    return res.json('OKE')
})

module.exports = {
    createPitch,
    getPitch,
    getPitchs,
    updatePitch,
    deletePitch,
    ratings,
    uploadImagesPitch
}