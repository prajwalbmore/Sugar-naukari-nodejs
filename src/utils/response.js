export const sendResponse = (res, success, message, data = null) => {
  return res.json({ success, message, data });
};
