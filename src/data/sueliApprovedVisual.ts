import type {Bio} from '../types/biosite'

// Visual snapshot of the existing client draft. No client record or private contacts.
export const sueliApprovedVisual = {
  "id": "sueli-nascimento",
  "logo": "/images/sueli-nascimento/logo.svg",
  "name": "Sueli Nascimento",
  "color": "#efad96",
  "cover": "/images/sueli-nascimento/salon.webp",
  "email": "",
  "hours": "Segunda à Sexta: 09:00 - 19:00\nSábado: 09:00 - 17:00\nDomingo: Fechado",
  "phone": "",
  "style": "nude-elegance",
  "photos": [
    "/images/sueli-nascimento/portrait.webp"
  ],
  "tiktok": "",
  "actions": [],
  "address": "Serra - ES",
  "mapsUrl": "",
  "tagline": "BELEZA & ESTILO",
  "benefits": [],
  "category": "Salão / Estética",
  "facebook": "",
  "headline": "Sua beleza\nem cada\ndetalhe ♡",
  "identity": {
    "brandColors": [
      "#100b07",
      "#efad96",
      "#f0cbbb",
      "#352018"
    ]
  },
  "products": [],
  "sections": [
    {
      "id": "sueli-nascimento-portrait",
      "kind": "gallery",
      "text": "",
      "title": "Retrato da profissional",
      "content": {
        "photos": [
          "/images/sueli-nascimento/portrait.webp"
        ]
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-actions",
      "kind": "actions",
      "text": "",
      "title": "",
      "visual": {
        "gap": 9,
        "columns": 4,
        "iconSize": 55,
        "glyphSize": 31,
        "labelSize": 12,
        "subtitleSize": 10
      },
      "content": {
        "actions": [
          {
            "id": "sueli-nascimento-whatsapp",
            "icon": "whatsapp",
            "kind": "whatsapp",
            "label": "WhatsApp",
            "visual": {
              "iconColor": "#efad96",
              "textColor": "#fff3e9",
              "background": "#211610"
            },
            "message": "",
            "subtitle": "Fale conosco",
            "appearanceMode": "custom"
          },
          {
            "id": "sueli-nascimento-instagram",
            "icon": "instagram",
            "kind": "instagram",
            "label": "Instagram",
            "visual": {
              "iconColor": "#efad96",
              "textColor": "#fff3e9",
              "background": "#211610"
            },
            "message": "",
            "subtitle": "Nos siga",
            "appearanceMode": "custom"
          },
          {
            "id": "sueli-nascimento-location-action",
            "icon": "pin",
            "kind": "location",
            "label": "Como chegar",
            "visual": {
              "iconColor": "#efad96",
              "textColor": "#fff3e9",
              "background": "#211610"
            },
            "message": "",
            "subtitle": "Ver no mapa",
            "appearanceMode": "custom"
          },
          {
            "id": "sueli-nascimento-booking-action",
            "icon": "calendar",
            "kind": "booking",
            "mode": "whatsapp",
            "label": "Agende seu",
            "visual": {
              "iconColor": "#efad96",
              "textColor": "#fff3e9",
              "background": "#211610"
            },
            "message": "Olá! Gostaria de agendar um atendimento.",
            "subtitle": "horário",
            "appearanceMode": "custom"
          }
        ]
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-booking",
      "kind": "whatsapp",
      "text": "Conheça tudo que temos para você.",
      "title": "NOSSOS SERVIÇOS",
      "action": {
        "id": "sueli-nascimento-link-services",
        "icon": "cart",
        "kind": "custom",
        "label": "Nossos serviços",
        "message": "",
        "sectionId": "sueli-nascimento-services",
        "destination": "section"
      },
      "visual": {
        "text": "#f4e7df",
        "panel": "#755342"
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-care",
      "kind": "promotion",
      "text": "Um momento de cuidado\nque você merece.",
      "image": "/images/sueli-nascimento/spa.webp",
      "title": "Spa Express\nMãos & Pés",
      "action": {
        "id": "sueli-nascimento-link-services",
        "icon": "external",
        "kind": "custom",
        "label": "Ver serviços",
        "message": "",
        "sectionId": "sueli-nascimento-services",
        "destination": "section"
      },
      "visual": {
        "text": "#35231e",
        "panel": "#d9b6a2",
        "mediaAspect": 115,
        "contentWidth": 48,
        "mediaPlacement": "right"
      },
      "enabled": true,
      "ctaLabel": "Ver serviços"
    },
    {
      "id": "sueli-nascimento-services",
      "kind": "services",
      "text": "Beleza, cuidado e bem-estar em um só lugar.",
      "title": "Nossos Serviços",
      "layout": "list",
      "visual": {
        "columns": 1,
        "mediaAspect": 135
      },
      "content": {
        "items": [
          {
            "id": "sueli-nascimento-service-0",
            "image": "/images/sueli-nascimento/nails.webp",
            "price": "",
            "title": "Unhas em Gel",
            "action": {
              "id": "sueli-nascimento-service-0-cta",
              "icon": "external",
              "kind": "booking",
              "mode": "whatsapp",
              "label": "Saiba mais",
              "message": "Olá! Gostaria de agendar um horário no SN Studio."
            },
            "categoryId": "sueli-nascimento-category-nails",
            "description": "Beleza, durabilidade\ne um acabamento impecável."
          },
          {
            "id": "sueli-nascimento-service-1",
            "image": "/images/sueli-nascimento/feet.webp",
            "price": "",
            "title": "Spa dos Pés",
            "action": {
              "id": "sueli-nascimento-service-1-cta",
              "icon": "external",
              "kind": "booking",
              "mode": "whatsapp",
              "label": "Saiba mais",
              "message": "Olá! Gostaria de agendar um horário no SN Studio."
            },
            "categoryId": "sueli-nascimento-category-feet",
            "description": "Um momento de cuidado\ne relaxamento para você."
          },
          {
            "id": "sueli-nascimento-service-2",
            "image": "/images/sueli-nascimento/hair.webp",
            "price": "",
            "title": "Tratamentos Capilares",
            "action": {
              "id": "sueli-nascimento-service-2-cta",
              "icon": "external",
              "kind": "booking",
              "mode": "whatsapp",
              "label": "Saiba mais",
              "message": "Olá! Gostaria de agendar um horário no SN Studio."
            },
            "categoryId": "sueli-nascimento-category-hair",
            "description": "Saúde, brilho e\ntransformação para\nos seus cabelos."
          },
          {
            "id": "sueli-nascimento-service-3",
            "image": "/images/sueli-nascimento/brows.webp",
            "price": "",
            "title": "Design de Sobrancelhas",
            "action": {
              "id": "sueli-nascimento-service-3-cta",
              "icon": "external",
              "kind": "booking",
              "mode": "whatsapp",
              "label": "Saiba mais",
              "message": "Olá! Gostaria de agendar um horário no SN Studio."
            },
            "categoryId": "sueli-nascimento-category-brows",
            "description": "Mais harmonia para\no seu olhar."
          }
        ],
        "actions": [
          {
            "id": "sueli-nascimento-category-all",
            "icon": "external",
            "kind": "custom",
            "label": "Todos",
            "message": "",
            "sectionId": "sueli-nascimento-services",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-category-nails",
            "icon": "external",
            "kind": "custom",
            "label": "Unhas",
            "message": "",
            "sectionId": "sueli-nascimento-services",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-category-hair",
            "icon": "external",
            "kind": "custom",
            "label": "Cabelos",
            "message": "",
            "sectionId": "sueli-nascimento-services",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-category-feet",
            "icon": "external",
            "kind": "custom",
            "label": "Spa dos Pés",
            "message": "",
            "sectionId": "sueli-nascimento-services",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-category-brows",
            "icon": "external",
            "kind": "custom",
            "label": "Mais",
            "message": "",
            "sectionId": "sueli-nascimento-services",
            "destination": "section"
          }
        ]
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-service-banner",
      "kind": "promotion",
      "text": "Unhas, cabelos, spa dos pés e muito mais.\nTudo para realçar a sua beleza.",
      "image": "/images/sueli-nascimento/banner.webp",
      "title": "Cada detalhe\nfaz a diferença! ♡",
      "action": {
        "id": "sueli-nascimento-services-book",
        "icon": "external",
        "kind": "booking",
        "mode": "whatsapp",
        "label": "Agende seu horário",
        "message": "Olá! Gostaria de agendar um horário no SN Studio."
      },
      "enabled": true,
      "ctaLabel": "Agende seu horário"
    },
    {
      "id": "sueli-nascimento-results",
      "kind": "gallery",
      "text": "Beleza que transforma e valoriza você.",
      "title": "Resultados Reais",
      "layout": "grid",
      "visual": {
        "columns": 2,
        "mediaAspect": 110
      },
      "content": {
        "photos": [
          "/images/sueli-nascimento/before.webp",
          "/images/sueli-nascimento/after.webp",
          "/images/sueli-nascimento/result-nails.webp",
          "/images/sueli-nascimento/brow-before.webp",
          "/images/sueli-nascimento/brow-after.webp",
          "/images/sueli-nascimento/feet-before.webp",
          "/images/sueli-nascimento/feet-after.webp"
        ],
        "actions": [
          {
            "id": "sueli-nascimento-result-category-all",
            "icon": "external",
            "kind": "custom",
            "label": "Todos",
            "message": "",
            "sectionId": "sueli-nascimento-results",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-result-category-hair",
            "icon": "external",
            "kind": "custom",
            "label": "Cabelos",
            "message": "",
            "sectionId": "sueli-nascimento-results",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-result-category-nails",
            "icon": "external",
            "kind": "custom",
            "label": "Unhas",
            "message": "",
            "sectionId": "sueli-nascimento-results",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-result-category-brows",
            "icon": "external",
            "kind": "custom",
            "label": "Sobrancelhas",
            "message": "",
            "sectionId": "sueli-nascimento-results",
            "destination": "section"
          },
          {
            "id": "sueli-nascimento-result-category-feet",
            "icon": "external",
            "kind": "custom",
            "label": "Mais",
            "message": "",
            "sectionId": "sueli-nascimento-results",
            "destination": "section"
          }
        ],
        "highlights": [
          {
            "id": "sueli-nascimento-result-0",
            "image": "/images/sueli-nascimento/before.webp",
            "label": "Antes",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-1",
            "image": "/images/sueli-nascimento/after.webp",
            "label": "Depois",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-2",
            "image": "/images/sueli-nascimento/result-nails.webp",
            "label": "",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-3",
            "image": "/images/sueli-nascimento/brow-before.webp",
            "label": "",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-4",
            "image": "/images/sueli-nascimento/brow-after.webp",
            "label": "",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-5",
            "image": "/images/sueli-nascimento/feet-before.webp",
            "label": "Antes",
            "caption": ""
          },
          {
            "id": "sueli-nascimento-result-6",
            "image": "/images/sueli-nascimento/feet-after.webp",
            "label": "Depois",
            "caption": ""
          }
        ]
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-result-banner",
      "kind": "promotion",
      "text": "Mais autoestima, beleza\ne confiança todos os dias.",
      "image": "/images/sueli-nascimento/result-banner.webp",
      "title": "Transformação\nde verdade",
      "action": {
        "id": "sueli-nascimento-link-results",
        "icon": "external",
        "kind": "custom",
        "label": "Ver mais resultados",
        "message": "",
        "sectionId": "sueli-nascimento-results",
        "destination": "section"
      },
      "enabled": true,
      "ctaLabel": "Ver mais resultados"
    },
    {
      "id": "sueli-nascimento-about",
      "kind": "about",
      "text": "Acreditamos que a beleza vai além da estética. Aqui é um espaço de cuidado, autoestima e bem-estar. Trabalhamos com dedicação para o seu melhor resultado, sempre com atendimento personalizado e produtos de qualidade.",
      "image": "/images/sueli-nascimento/about.webp",
      "title": "Sobre Nós",
      "visual": {
        "text": "#f9e6d8",
        "mediaPlacement": "right"
      },
      "enabled": true,
      "ctaLabel": "",
      "subtitle": ""
    },
    {
      "id": "sueli-nascimento-about-benefits",
      "kind": "benefits",
      "text": "",
      "title": "",
      "visual": {
        "columns": 4
      },
      "content": {
        "benefits": [
          "Atendimento|personalizado",
          "Ambiente|acolhedor",
          "Produtos|de qualidade",
          "Sua beleza|é prioridade"
        ]
      },
      "enabled": true,
      "entryIcons": {
        "benefits-3d6efc7c-d5e66328": {
          "id": "sueli-nascimento-benefit-2",
          "icon": "leaf",
          "kind": "custom",
          "label": "Produtos|de qualidade",
          "message": ""
        },
        "benefits-7ac5c203-4c37f951": {
          "id": "sueli-nascimento-benefit-1",
          "icon": "heart",
          "kind": "custom",
          "label": "Ambiente|acolhedor",
          "message": ""
        },
        "benefits-b799b1df-b7196979": {
          "id": "sueli-nascimento-benefit-3",
          "icon": "users",
          "kind": "custom",
          "label": "Sua beleza|é prioridade",
          "message": ""
        },
        "benefits-d31ea8c2-a74abb36": {
          "id": "sueli-nascimento-benefit-0",
          "icon": "diamond",
          "kind": "custom",
          "label": "Atendimento|personalizado",
          "message": ""
        }
      }
    },
    {
      "id": "sueli-nascimento-space",
      "kind": "gallery",
      "text": "",
      "title": "Nosso Espaço",
      "action": {
        "id": "sueli-nascimento-link-space",
        "icon": "external",
        "kind": "custom",
        "label": "Ver mais",
        "message": "",
        "sectionId": "sueli-nascimento-space",
        "destination": "section"
      },
      "layout": "carousel",
      "visual": {
        "columns": 1,
        "mediaAspect": 190
      },
      "content": {
        "photos": [
          "/images/sueli-nascimento/space.webp",
          "/images/sueli-nascimento/salon.webp"
        ]
      },
      "enabled": true,
      "ctaLabel": "Ver mais"
    },
    {
      "id": "sueli-nascimento-hours",
      "kind": "hours",
      "text": "",
      "title": "Nosso Horário",
      "visual": {
        "text": "#35231e",
        "panel": "#ecd5c8"
      },
      "enabled": true
    },
    {
      "id": "sueli-nascimento-location",
      "kind": "location",
      "text": "",
      "image": "",
      "title": "Como chegar",
      "action": {
        "id": "sueli-nascimento-map",
        "icon": "location",
        "kind": "location",
        "label": "Ver no mapa",
        "message": ""
      },
      "visual": {
        "text": "#35231e",
        "panel": "#f4e7df"
      },
      "enabled": true,
      "ctaLabel": "Ver no mapa"
    },
    {
      "id": "sueli-nascimento-contact",
      "kind": "whatsapp",
      "text": "Seu momento de beleza\nte espera.",
      "image": "/images/sueli-nascimento/salon.webp",
      "title": "Agende seu\nhorário agora!",
      "action": {
        "id": "sueli-nascimento-contact-book",
        "icon": "whatsapp",
        "kind": "booking",
        "mode": "whatsapp",
        "label": "Agendar pelo WhatsApp",
        "message": "Olá! Gostaria de agendar um horário no SN Studio."
      },
      "visual": {
        "text": "#f4e7df",
        "panel": "#755342"
      },
      "enabled": true
    }
  ],
  "services": [],
  "instagram": "",
  "telephone": "",
  "appearance": {
    "font": "sans",
    "text": "#f9e6d8",
    "cards": "rounded",
    "panel": "#f0cbbb",
    "theme": "dark",
    "border": "#c99983",
    "buttons": "rounded",
    "highlight": "#efad96",
    "secondary": "#352018",
    "background": "#100b07"
  },
  "heroVisual": {
    "overlay": 45,
    "logoSize": 90,
    "contentWidth": 100,
    "imagePositionX": 50,
    "imagePositionY": 50
  },
  "highlights": [],
  "reviewsUrl": "",
  "textVisual": {
    "name": {
      "font": "serif",
      "weight": "regular",
      "fontSize": 25
    },
    "headline": {
      "font": "serif",
      "weight": "regular",
      "fontSize": 31,
      "textStyle": "italic"
    },
    "description": {
      "fontSize": 11
    }
  },
  "description": "CUIDANDO DE VOCÊ\nCOM PROFISSIONALISMO\nE RESULTADOS REAIS.",
  "layoutPreset": "sueli-nascimento"
} as unknown as Bio
