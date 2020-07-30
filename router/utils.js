function setRouteParamsName (params, module) {
  const resultParams = Object.assign({}, params)
  if (params.name) {
    resultParams.name = `${module.link}/${params.name}`
  }
  if (params.children && params.children.length) {
    resultParams.children = params.children.map(x => setRouteParamsName(x, module))
  }
  return resultParams
}

function getModulesRoutes (modules, sectionRoutes) {
  const routes = []
  if (!modules) {
    return routes
  }
  for (const module of modules) {
    module.sections.forEach(({ link: sectionLink }) => {
      const basicSectionLink = sectionLink.match(/(.*?)(\/|\?|$)/)[1]
      const routeParams = sectionRoutes[basicSectionLink]
      if (!routeParams) {
        return
      }
      const namedRouteParams = setRouteParamsName(routeParams, module)
      const route = {
        ...namedRouteParams,
        path: `/${module.link}/${basicSectionLink}`
      }
      routes.push(route)
    })
  }
  return routes
}

function findModuleAndSectionInModulesByPath (path, modules) {
  const splitted = path.split('/').filter(x => x)
  const [moduleLink, sectionAndOtherLink] = splitted

  const module = modules.find(x => x.link === moduleLink)
  const section = module && module.sections.find(x => sectionAndOtherLink === x.link)

  return { module, section }
}

export { getModulesRoutes, findModuleAndSectionInModulesByPath }
