import { SDK } from '@rsdoctor/types';
import { File } from '@rsdoctor/utils/common';

interface DependencyData {
  type?: string;
}

/** Determine whether it is the import statement itself */
export function isImportDependency({ type }: DependencyData) {
  return (
    type === 'harmony side effect evaluation' ||
    type === 'cjs require' ||
    type === 'cjs full require' ||
    type === 'cjs export require' ||
    type === 'provided' ||
    type === 'esm import' // rspack esm import module type
  );
}

export function getImportKind(dep: DependencyData): SDK.DependencyKind {
  const { type } = dep;

  if (!type) {
    return SDK.DependencyKind.Unknown;
  }

  if (type.includes('harmony')) {
    return SDK.DependencyKind.ImportStatement;
  }

  if (type.includes('cjs')) {
    return SDK.DependencyKind.RequireCall;
  }

  if (type.includes('import()')) {
    return SDK.DependencyKind.DynamicImport;
  }

  if (type.includes('amd')) {
    return SDK.DependencyKind.AMDRequire;
  }

  return SDK.DependencyKind.Unknown;
}

/**
 * Remove the css module without connection
 *   - This will happen when the user uses the mini-css plug-in.
 */
export function removeNoImportStyle(graph: SDK.ModuleGraphInstance) {
  graph
    .getModules()
    .filter((module) => File.isStyleExt(module.path))
    .filter((item) => item.getImported().length === 0)
    .forEach((item) => graph.removeModule(item));
}
