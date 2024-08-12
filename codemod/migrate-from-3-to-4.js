export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find pattern: import { useGlobalStates } from './store';
  // NOTE: Change this for your project
  root
    .find(j.ImportDeclaration, {
      source: {
        value: (value) => value.endsWith('/store'),
      },
      specifiers: [
        {
          imported: {
            name: 'useGlobalStates',
          },
        },
      ],
    })
    .forEach((path) => {
      j(path).replaceWith(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('useGlobalState'))],
          j.literal(path.value.source.value),
        ),
      );
    });

  // Transform useGlobalStates calls
  root
    .find(j.VariableDeclaration, {
      declarations: [
        {
          type: 'VariableDeclarator',
          init: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'useGlobalStates',
            },
          },
        },
      ],
    })
    .forEach((path) => {
      const variableDeclarator = path.value.declarations[0];
      const { properties } = variableDeclarator.id;
      const replacements = properties.flatMap((property) => {
        const key = property.key.name;
        const { value } = property;

        if (value.type === 'ObjectPattern') {
          return value.properties.map((nestedProp) => {
            const nestedKey = nestedProp.key.name;
            const nestedValue = nestedProp.value;
            const declaration = j.variableDeclaration('const', [
              j.variableDeclarator(
                j.objectPattern([
                  j.objectProperty(
                    j.identifier(nestedKey),
                    nestedValue,
                  ),
                ]),
                j.callExpression(j.identifier('useGlobalState'), [
                  j.literal(key),
                ]),
              ),
            ]);
            return declaration.declarations.length > 0 ? declaration : null;
          }).filter(Boolean);
        }
        return null;
      }).filter(Boolean);

      if (replacements.length > 0) {
        j(path).replaceWith(replacements);
      }
    });

  return root.toSource();
}
