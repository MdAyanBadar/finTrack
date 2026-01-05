import api from "./api";

export const getTransactions = async () => {
  const res = await api.get("/transactions");
  return res.data;
};

export const addTransaction = async (data) => {
  const res = await api.post("/transactions", data);
  return res.data;
};

export const deleteTransaction = async (id) => {
  await api.delete(`/transactions/${id}`);
};
