var lr = ALLEX.execSuite.libRegistry;
lr.register('vektr_compositingcontrollerslib',
  require('./index')(
    ALLEX,
    lr.get('allex_hierarchymixinslib'),
    lr.get('vektr_controllerslib'),
    lr.get('vektr_compositinglib'),
    lr.get('vektr_commonlib'),
    lr.get('vektr_windowmonitoringlib')
  )
);
