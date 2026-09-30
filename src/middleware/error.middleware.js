const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode;

  if (!statusCode && err.name === "ZodError") {
    statusCode = 400;
  } else if (
    !statusCode &&
    (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
  ) {
    statusCode = 401;
  } else if (!statusCode && err.code === "P2002") {
    statusCode = 409;
  } else if (!statusCode && err.code === "P2025") {
    statusCode = 404;
  } else if (!statusCode && /not found|not exist|not existed/i.test(err.message)) {
    statusCode = 404;
  } else if (!statusCode && /already|last owner/i.test(err.message)) {
    statusCode = 409;
  } else if (
    !statusCode &&
    /required|invalid|cannot transition|provide at least|not a member/i.test(err.message)
  ) {
    statusCode = 400;
  } else if (!statusCode && /authentication|credentials|not registered|not loggedin/i.test(err.message)) {
    statusCode = 401;
  }

  statusCode ??= 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal Server Error" : err.message,
    ...(err.name === "ZodError" && { errors: err.issues }),
  });
};

export default errorMiddleware;
