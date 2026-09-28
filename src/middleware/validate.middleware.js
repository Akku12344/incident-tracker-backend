export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
      });

      req.body = result.body;
      req.params = result.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};
