const schedule = require("node-schedule");

exports.deletePicture = schedule.scheduleJob("0 5 * * *", async function () {
  const currPic = image.id;
  const deletedPic = await Picture.destroy({
    where: { id: currPic, userId: user.id },
  });
  console.log(`${deletedPic} Pic Deleted: with id: -> ${currPic}`);
  schedule.gracefulShutdown();
});
