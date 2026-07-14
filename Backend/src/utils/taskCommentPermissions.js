const createCommentPayload = ({ text }, user) => ({
  text: text?.trim(),
  author: user?.id,
});

const canDeleteComment = (user, comment) => {
  if (!user || !comment) return false;

  const isAuthor = comment.author?.toString() === user.id;
  const isAdmin = user.role === 'admin';

  return Boolean(isAuthor || isAdmin);
};

module.exports = {
  createCommentPayload,
  canDeleteComment,
};
