// Generated by CoffeeScript 1.9.3
(function() {
  describe.only('Objective Injector', function() {
    var should;
    require('../../../');
    should = require('should');
    before(function() {
      return this.origError = objective.logger.error;
    });
    beforeEach(function() {
      return objective.logger.error = this.origError;
    });
    after(function() {
      return objective.logger.error = this.origError;
    });
    it('is shared', function() {
      return should.exist(objective.injector);
    });
    context('standard args', function() {
      it('injects error', function(done) {
        var e;
        e = new Error('Monday');
        return objective.injector({
          error: e
        }, function(e) {
          return e.toString().should.match(/Error: Monday/);
        }).then(function() {
          return objective.injector({
            error: e
          }, function(er) {
            return er.toString().should.match(/Error: Monday/);
          }).then(function() {
            return objective.injector({
              error: e
            }, function(err) {
              return err.toString().should.match(/Error: Monday/);
            }).then(function() {
              return objective.injector({
                error: e
              }, function(error) {
                return error.toString().should.match(/Error: Monday/);
              }).then(done);
            });
          });
        })["catch"](done);
      });
      it('logs un accepted errors', function(done) {
        var e;
        e = new Error('Winter');
        objective.logger.error = function(m, err) {
          m.should.equal('unaccepted error injected');
          err.should.equal(e.stack);
          return done();
        };
        return objective.injector({
          args: [1],
          error: e
        }, function(noErrorInArgs) {});
      });
      xit('injects next or done', function(_done) {
        return objective.injector({
          next: function() {
            return _done();
          }
        }, function(done, next) {
          done.should.equal(next);
          return next();
        });
      });
      it('injects plugins, recursor, linker, and globals', function(done) {
        return objective.injector({
          plugins: 1,
          recurse: 2,
          link: 3
        }, function(plugins, recurse, link, pipeline, injector, prompt) {
          plugins.should.eql(1);
          recurse.should.eql(2);
          link.should.eql(3);
          pipeline.should.eql(objective.pipeline);
          injector.should.eql(objective.injector);
          prompt.should.eql(objective.prompt);
          return done();
        });
      });
      return it('injects cancel as cancel or stop', function(done) {
        return objective.injector({
          cancel: function() {
            return done();
          }
        }, function(cancel, stop) {
          stop.should.equal(cancel);
          return stop();
        });
      });
    });
    it('injects a sequence of args among the standard args', function(done) {
      return objective.injector({
        args: [1, 2, 3, 4],
        next: done
      }, function(one, two, next, three, four) {
        one.should.equal(1);
        two.should.equal(2);
        three.should.equal(3);
        four.should.equal(4);
        return next();
      });
    });
    context('plugin access to injector', function() {
      return it('queries pipeline for arg', function(done) {
        var handler, root;
        root = 'ROOT';
        objective.pipeline.on('objective.injecting', handler = function(details) {
          details.root.should.equal(root);
          details.thisName.should.equal('unknownArg');
          (typeof details.thisValue === 'undefined').should.equal(true);
          return details.thisValue = 'CREATED ARG';
        });
        return objective.injector({
          root: root,
          args: [1, 2],
          next: done
        }, function(next, one, two, unknownArg) {
          objective.pipeline.off('objective.injecting', handler);
          unknownArg.should.equal('CREATED ARG');
          return next();
        });
      });
    });
    context('node_module injection', function() {
      it('falls back to node modules', function(done) {
        return objective.injector({
          args: [1, 2],
          next: done
        }, function(next, one, two, zlib) {
          zlib.should.equal(require('zlib'));
          return next();
        });
      });
      return it('calls onInjectError', function(done) {
        return objective.injector({
          onInjectError: function(e) {
            e.toString().should.match(/Cannot find module \'missing\'/);
            return done();
          }
        }, function(missing) {});
      });
    });
    context('proxied promise', function() {
      var promise;
      promise = require('when').promise;
      it('proxies the promise returned by the injection target', function(done) {
        var promised;
        promised = objective.injector(function() {
          return promise(function(resolve, reject) {
            return resolve('Result!');
          });
        });
        return promised.then(function(result) {
          result.should.equal('Result!');
          return done();
        });
      });
      return it('passes the call to start', function(done) {
        var promised;
        promised = objective.injector(function() {
          var p, result;
          result = null;
          p = promise(function(resolve, reject) {
            return process.nextTick(function() {
              return resolve(result);
            });
          });
          p.start = function(err, arg) {
            return result = arg;
          };
          return p;
        });
        promised.then(function(result) {
          result.should.equal('ARG');
          return done();
        });
        return promised.start('ARG');
      });
    });
    context('ignoreInjectError', function() {
      var promise;
      promise = require('when').promise;
      it('sends injection error into function', function(done) {
        return objective.injector({
          onInjectError: function(e) {
            e.toString().should.match(/Cannot find module/);
            return new Error('Can Filter Error');
          },
          redirectInjectError: true
        }, function(e, noSuchModule) {
          e.toString().should.match(/Can Filter Error/);
          return done();
        });
      });
      it('sets to run even with injection error', function(done) {
        return objective.injector({
          ignoreInjectError: true
        }, function(noSuchModule) {
          should.not.exist(noSuchModule);
          return done();
        });
      });
      return it('can get error into injection target via promise start extension', function(done) {
        var promised;
        promised = objective.injector({
          ignoreInjectError: true
        }, function(noSuchModule) {
          var p;
          p = promise(function(resolve) {
            return resolve();
          });
          p.start = function(e) {
            e.toString().should.match(/Cannot find module \'noSuchModule\'/);
            return done();
          };
          return p;
        });
        return promised.start();
      });
    });
    context('on run error', function() {
      return it('rejects the promise', function(done) {
        return objective.injector(function() {
          throw new Error('Monday');
        })["catch"](function(e) {
          e.toString().should.match(/Monday/);
          return done();
        });
      });
    });
    return context('on missing promise', function() {
      return it('calls for a promise', function(done) {
        return objective.injector({
          onMissingPromise: function() {
            return {
              then: function() {
                return done();
              }
            };
          }
        }, function() {});
      });
    });
  });

}).call(this);
