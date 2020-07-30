import RegistriesPage from '^/pages/Registries'
import Registries from '^/components/registry/Registries'
import RegistriesRoot from '^/components/registry/RegistriesRoot'
import SystemLog from '^/pages/SystemLog'
import GeoresourcesCatalogPage from '^/pages/GeoresourcesCatalog'
import GeoresourcesCatalogList from '^/components/georesourcesCatalog/GeoresourcesCatalogList'
import GeoresourcesCatalogCard from '^/components/georesourcesCatalog/GeoresourcesCatalogCard'

const routes = {
  'registries': {
    component: RegistriesPage,
    children: [
      {
        path: '',
        component: Registries,
        // Передает query маршрута, как пропсы
        props: route => route.query
      },
      {
        path: 'registries-root',
        component: RegistriesRoot,
        props: true
      },
      {
        path: ':id',
        component: Registries,
        props: true
      }
    ]
  },
  'system-log': {
    name: 'systemLog',
    component: SystemLog
  },
  'georesources-catalog': {
    component: GeoresourcesCatalogPage,
    children: [
      {
        path: '',
        name: 'georesourcesCatalogList',
        component: GeoresourcesCatalogList
      },
      {
        path: 'pd-card/:id',
        name: 'pdCard',
        props: true,
        component: GeoresourcesCatalogCard
      },
      {
        path: 'pd-card',
        name: 'pdCardCreate',
        component: GeoresourcesCatalogCard
      }
    ]
  }
}

export default routes
