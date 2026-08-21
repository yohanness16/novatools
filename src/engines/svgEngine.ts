export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeDoctype: boolean;
  removeMetadata: boolean;
  removeEditorData: boolean;
  cleanupIds: boolean;
  minifyWhitespace: boolean;
  roundDecimals: boolean;
}

export class SvgEngine {
  /**
   * Clean and optimize SVG XML string
   */
  static optimize(svgText: string, options: SvgOptimizeOptions): string {
    let result = svgText;

    if (options.removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    if (options.removeDoctype) {
      result = result.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
      result = result.replace(/<\?xml[\s\S]*?\?>/gi, '');
    }

    if (options.removeMetadata) {
      result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
      result = result.replace(/<desc[\s\S]*?<\/desc>/gi, '');
      result = result.replace(/<title[\s\S]*?<\/title>/gi, '');
    }

    if (options.removeEditorData) {
      // Remove Inkscape, Adobe, Sketch namespaces and attributes
      result = result.replace(/\sxmlns:(?:inkscape|sodipodi|sketch|illustrator|i)="[^"]*"/gi, '');
      result = result.replace(/\s(?:inkscape|sodipodi|sketch|i):[a-zA-Z0-9_-]+="[^"]*"/gi, '');
      result = result.replace(/<sodipodi:namedview[\s\S]*?\/>/gi, '');
      result = result.replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview>/gi, '');
    }

    if (options.roundDecimals) {
      // Round numeric points to 2 decimal places to shave bytes
      result = result.replace(/(\d+\.\d{3,})/g, (match) => {
        return parseFloat(match).toFixed(2);
      });
    }

    if (options.minifyWhitespace) {
      result = result.replace(/\s+/g, ' ');
      result = result.replace(/>\s+</g, '><');
      result = result.trim();
    }

    return result;
  }

  /**
   * Convert raw SVG into a standard React / JSX component string
   */
  static toReactComponent(svgText: string, componentName: string = 'SvgIcon'): string {
    // Convert attributes from kebab-case to camelCase
    let jsx = svgText
      .replace(/class=/g, 'className=')
      .replace(/clip-path=/g, 'clipPath=')
      .replace(/fill-rule=/g, 'fillRule=')
      .replace(/clip-rule=/g, 'clipRule=')
      .replace(/stroke-width=/g, 'strokeWidth=')
      .replace(/stroke-linecap=/g, 'strokeLinecap=')
      .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
      .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
      .replace(/stroke-dasharray=/g, 'strokeDasharray=')
      .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
      .replace(/stroke-opacity=/g, 'strokeOpacity=')
      .replace(/fill-opacity=/g, 'fillOpacity=')
      .replace(/stop-color=/g, 'stopColor=')
      .replace(/stop-opacity=/g, 'stopOpacity=')
      .replace(/xmlns:xlink=/g, 'xmlnsXlink=')
      .replace(/xlink:href=/g, 'xlinkHref=');

    // Add props spread to <svg ...>
    jsx = jsx.replace(/<svg\b([^>]*)>/, '<svg $1 {...props}>');

    const componentCode = `import type { SVGProps } from 'react';

export function ${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
    ${jsx}
  );
}
`;
    return componentCode;
  }
}
