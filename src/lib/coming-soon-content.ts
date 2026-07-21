export const comingSoonServices = {
  cargo: {
    eyebrow: "BUKHT CARGO",
    title: "Карго үйлчилгээ",
    description: "Карго үйлчилгээгээ танд илүү хялбар, найдвартай хүргэхээр бэлтгэж байна.",
  },
  esim: {
    eyebrow: "BUKHT eSIM",
    title: "eSIM үйлчилгээ",
    description: "Аяллын дата багцуудаа хурдан, хялбар авах боломжийг бэлтгэж байна.",
  },
} as const

export type ComingSoonService = keyof typeof comingSoonServices
